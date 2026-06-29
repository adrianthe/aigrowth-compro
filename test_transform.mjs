async function testTransform() {
  const url = 'https://lidficlatdnnjsmcgyfl.supabase.co/storage/v1/render/image/public/showcase-images/articles/0.5901369595837648.png?width=500&quality=50';
  const res = await fetch(url);
  if (res.ok) {
    console.log('Success, size:', res.headers.get('content-length'));
  } else {
    console.log('Failed:', res.status, await res.text());
  }
}
testTransform();
