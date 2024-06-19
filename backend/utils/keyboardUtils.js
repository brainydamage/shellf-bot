const commands = require('../constants/commands');
const userMessages = require('../constants/userMessages');

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
      text: userMessages.BUTTON_CANCEL,
      callback_data: `_cancel`,
    },
  ])

  return keyboardArray;
};

module.exports.getProlongKeyboard = async (bookID, rowNumber) => {
  let keyboardArray = [];

  keyboardArray.push([
    {
      text: userMessages.BUTTON_PROLONG,
      callback_data: `_prolong_${bookID}`,
    },
  ])

  keyboardArray.push([
    {
      text: userMessages.BUTTON_HOW_TO_RETURN,
      callback_data: `_how_to_return`,
    },
  ])

  return keyboardArray;
};