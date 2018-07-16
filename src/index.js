fetch("/.netlify/functions/graphql")
  .then(res => res.json())
  .then(res => {
    document.body.innerHTML = `
    <pre>${JSON.stringify(res, null, 2)}</pre>
  `;
  });
