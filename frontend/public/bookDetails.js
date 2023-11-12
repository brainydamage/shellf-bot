window.onload = function() {
  const bookID = new URL(window.location.href).pathname.split("/")[2];

  fetch(`/api/book/${bookID}`)
    .then(response => {
      if (!response.ok) {
        console.log(response);
        throw new Error('Network response was not ok: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      // console.log(data);
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
      console.error('Error:', error);
      document.getElementById('book-info').style.display = 'block';
      // document.getElementById('book-author').style.display = 'block';
      document.getElementById('help-button').style.display = 'block';

      document.getElementById('book-author').textContent = 'не могу найти книгу (';
      // document.getElementById('loading-message').textContent = 'не получилось найти книгу (';

      document.getElementById('loading-message').style.display = 'none';
      document.getElementById('loader').style.display = 'none';
    });
};

document.getElementById('help-button').onclick = function() {
  window.open('https://t.me/shellllllf', '_blank');
};
