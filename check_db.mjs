import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lidficlatdnnjsmcgyfl.supabase.co';
const supabaseKey = 'sb_publishable_D_nMFjrmRozRElqUI-ajww_SDhQEK1n';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('prompts').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, but no error. Cannot determine columns from empty select.');
    }
  }
}

checkSchema();
