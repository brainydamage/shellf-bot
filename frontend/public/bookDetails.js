window.onload = function () {
  const gwUrl = 'https://y1jyo2lk58.execute-api.eu-central-1.amazonaws.com';
  const pathParts = new URL(window.location.href).pathname.split("/");
  const bookID = pathParts.length > 2 ? pathParts[2] : null;

  if (bookID) {
    fetch(`${gwUrl}/book/${bookID}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('An error occurred: ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        // Update the webpage with the book details
        // Example: document.getElementById('book-info').innerText = data.title;
        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('loader').style.display = 'none';

        document.getElementById('book-title').textContent = data.title;
        document.getElementById('book-author').textContent = data.author;

        document.getElementById('book-info').style.display = 'block';
        document.getElementById('borrow-button').style.display = 'block';

      })
      .catch(error => {
        // console.error('Error:', error);
        document.getElementById('book-info').style.display = 'block';
        document.getElementById('help-button').style.display = 'block';

        document.getElementById('book-author').textContent =
          'не могу найти книгу (';

        document.getElementById('loading-message').style.display = 'none';
        document.getElementById('loader').style.display = 'none';
      });
  } else {
    document.getElementById('book-info').style.display = 'block';
    document.getElementById('help-button').style.display = 'block';

    document.getElementById('book-author').textContent = 'что-то пошло не так';

    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('loader').style.display = 'none';
  }
};

document.getElementById('help-button').onclick = function () {
  window.open('https://t.me/shellllllf', '_blank');
};

document.getElementById('borrow-button').onclick = function () {
  const pathParts = new URL(window.location.href).pathname.split("/");
  const bookID = pathParts.length > 2 ? pathParts[2] : 'no_id';
  window.location = `https://t.me/shellf_bot?start=${bookID}`;
};