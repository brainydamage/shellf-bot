module.exports.getDatesKeyboardArray = async (arrayOfBooks) => {
  let keyboardArray = [];

  arrayOfBooks.forEach(book => {
    Object.entries(book).forEach(([bookID, bookInfo]) => {
      // console.log(`Book ID: ${bookID}, Book Info: ${bookInfo}`);

      const innerArray = [
        {
          text: `${bookInfo}`,
          callback_data: `_return_${bookID}`,
        },
      ];

      keyboardArray.push(innerArray);

    });
  });

  keyboardArray.push([
    {
      text: 'отмена',
      callback_data: `_cancel`,
    },
  ])

  return keyboardArray;
};

module.exports.getProlongKeyboard = async (bookID) => {
  let keyboardArray = [];

  keyboardArray.push([
    {
      text: 'продлить на 1 неделю',
      callback_data: `_prolong_${bookID}`,
    },
  ])

  return keyboardArray;
};