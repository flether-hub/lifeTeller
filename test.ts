async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/fortune/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'test',
        gender: 'M',
        date: '2000-01-01',
        time: '12:00',
        calendar_type: 'Solar',
        province: 'BJ',
        resultJson: { test: '1' }
      })
    });
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("HEADERS:", res.headers);
    console.log("BODY:", text);
  } catch (e) {
    console.error(e);
  }
}
test();
