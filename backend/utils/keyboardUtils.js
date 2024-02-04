const commands = require('../constants/commands');

module.exports.getDatesKeyboardArray = async (arrayOfBooks, returnBook) => {
  let keyboardArray = [];

  const callback = returnBook ? commands.RETURN_CALLBACK :
    commands.UNSUBSCRIBE_CALLBACK;

  arrayOfBooks.forEach(book => {
    const {bookID, bookInfo, rowNumber} = book;

    const innerArray = [
      {
        text: `${bookInfo}`,
        callback_data: `${callback}_${bookID}`,
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
      callback_data: `_prolong_${bookID}`,
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