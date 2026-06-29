import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lidficlatdnnjsmcgyfl.supabase.co';
const supabaseKey = 'sb_publishable_D_nMFjrmRozRElqUI-ajww_SDhQEK1n';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase.from('prompts').insert([{ 
    prompt: 'test prompt', 
    tags: ['test'] 
  }]);
  
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
