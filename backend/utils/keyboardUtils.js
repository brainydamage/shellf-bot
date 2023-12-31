module.exports.getDatesKeyboardArray = async (arrayOfBooks) => {
  let keyboardArray = [];

  arrayOfBooks.forEach(book => {
    const {bookID, bookInfo, rowNumber} = book;

    const innerArray = [
      {
        text: `${bookInfo}`,
        callback_data: `_return_${bookID}_row${rowNumber}`,
      },
    ];

    keyboardArray.push(innerArray);
  });

  keyboardArray.push([
    {
      text: 'отмена',
      callback_data: `_cancel`,
    },
  ])

  return keyboardArray;
};

module.exports.getProlongKeyboard = async (bookID, rowNumber) => {
  let keyboardArray = [];

  keyboardArray.push([
    {
      text: 'продлить на 1 неделю',
      callback_data: `_prolong_${bookID}_row${rowNumber}`,
    },
  ])

  keyboardArray.push([
    {
      text: 'как вернуть?',
      callback_data: `_how_to_return`,
    },
  ])

  return keyboardArray;
};