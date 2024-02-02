window.onload = function () {
  const gwUrl = 'https://y1jyo2lk58.execute-api.eu-central-1.amazonaws.com';

  fetch(`${gwUrl}/books`)
    .then(response => {
      if (!response.ok) {
        throw new Error('An error occurred: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
    })
    .catch((error) => {
      console.error(error)
    });
};

function searchBooks() {
  const input = document.getElementById('search-input');
  const filter = input.value.toUpperCase();
  const table = document.getElementById("books-table");
  const tr = table.getElementsByTagName("tr");

  for (let i = 1; i < tr.length; i++) {
    const td = tr[i].getElementsByTagName("td");
    if (td.length > 1) { // Ensure there are enough <td> elements
      const title = td[0].getElementsByClassName(
        "book-title")[0].textContent.toUpperCase();
      const author = td[0].getElementsByClassName(
        "book-author")[0].textContent.toUpperCase();
      const shelf = td[1].textContent.toUpperCase(); // Get the shelf name from
                                                     // the second <td>

      // Check if the row should be displayed based on title, author, or shelf
      if (title.indexOf(filter) > -1 || author.indexOf(filter) > -1 ||
        shelf.indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

document.getElementById('search-input')
  .addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      // Prevent the default action to avoid submitting the form
      event.preventDefault();
      // Remove focus from the input field
      this.blur();
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const rows = document.querySelectorAll('#books-table tr');

  rows.forEach(function (row) {
    row.addEventListener('touchstart', function () {
      this.classList.add('row-tap-feedback');
    });

    row.addEventListener('touchend', function () {
      // Use setTimeout to leave the feedback class long enough to be noticed
      setTimeout(() => this.classList.remove('row-tap-feedback'), 200);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const rows = document.querySelectorAll('#books-table tr');
  let currentButtonRow = null; // Keep track of the current button row

  // Listen for clicks anywhere in the document
  document.addEventListener('click', function (event) {
    // If there's a button row and the click is outside of it, remove the
    // button row
    if (currentButtonRow && !currentButtonRow.contains(event.target) &&
      !event.target.closest('#books-table tr')) {
      currentButtonRow.remove();
      currentButtonRow = null; // Reset the current button row tracker
    }
  }, true); // Capture phase to handle the event before it propagates

  rows.forEach(function (row, index) {
    // Skip the header row
    if (index > 0) {
      row.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent the click from reaching the
                                 // document listener

        // Remove styles from previously clicked row
        const previousClickedRow = document.querySelector('.clicked-row');
        if (previousClickedRow) {
          previousClickedRow.classList.remove('clicked-row');
        }

        // Mark the current row as clicked
        this.classList.add('clicked-row');

        // Remove any existing button row
        if (currentButtonRow) {
          currentButtonRow.remove();
        }

        // Create a new button row
        const buttonRow = document.createElement('tr');
        buttonRow.className = 'redirect-button-row';
        const buttonCell = document.createElement('td');
        buttonCell.colSpan = this.cells.length; // Span across all columns
        const button = document.createElement('button');
        button.textContent = 'подписаться на книгу';
        button.className = 'redirect-button';
        button.addEventListener('click', function (event) {
          event.stopPropagation(); // Prevent triggering row's click event
          window.location.href = row.getAttribute('data-href'); // Redirect
        });

        // Append the button to the cell, and the cell to the row
        buttonCell.appendChild(button);
        buttonRow.appendChild(buttonCell);

        // Insert the new button row directly after the clicked row
        if (row.nextSibling) {
          row.parentNode.insertBefore(buttonRow, row.nextSibling);
        } else {
          // If the clicked row is the last one, append the button row at the
          // end
          row.parentNode.appendChild(buttonRow);
        }

        setTimeout(() => button.style.opacity = '1', 5); // Delay of 1
                                                         // millisecond

        // Track the current button row
        currentButtonRow = buttonRow;
      });
    }
  });
});

