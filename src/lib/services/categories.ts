import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createCategorySchema, updateCategorySchema, CreateCategoryInput, UpdateCategoryInput } from '@/lib/validations/category';
import { TransactionKind, TransactionBucket } from '@/types/database.types';

export interface CategoryDTO {
  id: string;
  user_id: string;
  name: string;
  kind: TransactionKind;
  default_bucket: TransactionBucket;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function listCategories(): Promise<CategoryDTO[]> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('kind', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to list categories: ${error.message}`);
  return (data || []).map(formatCategoryDTO);
}

export async function listCategoriesGroupedByKind(): Promise<Record<TransactionKind, CategoryDTO[]>> {
  const categories = await listCategories();
  const result: Record<TransactionKind, CategoryDTO[]> = {
    income: [],
    expense: [],
    saving: [],
  };

  for (const cat of categories) {
    if (cat.is_active) {
      result[cat.kind].push(cat);
    }
  }

  return result;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryDTO> {
  const validated = createCategorySchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  let defaultBucket: TransactionBucket = null;
  if (validated.kind === 'expense') {
    defaultBucket = validated.default_bucket || 'needs';
  } else if (validated.kind === 'saving') {
    defaultBucket = 'savings';
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: validated.name.trim(),
      kind: validated.kind,
      default_bucket: defaultBucket,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Category "${validated.name}" already exists for kind "${validated.kind}"`);
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return formatCategoryDTO(data);
}

export async function updateCategory(input: UpdateCategoryInput): Promise<CategoryDTO> {
  const validated = updateCategorySchema.parse(input);
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Unauthorized');
  const userId = userData.user.id;

  const updateData: Record<string, unknown> = {};
  if (validated.name !== undefined) updateData.name = validated.name.trim();
  if (validated.default_bucket !== undefined) updateData.default_bucket = validated.default_bucket;
  if (validated.is_active !== undefined) updateData.is_active = validated.is_active;

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', validated.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update category: ${error.message}`);
  return formatCategoryDTO(data);
}

export async function archiveCategory(id: string): Promise<CategoryDTO> {
  return updateCategory({ id, is_active: false });
}

function formatCategoryDTO(row: Record<string, unknown>): CategoryDTO {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    kind: row.kind as TransactionKind,
    default_bucket: (row.default_bucket as TransactionBucket) || null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
