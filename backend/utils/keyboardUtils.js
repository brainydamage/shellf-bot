const {logging} = require("googleapis/build/src/apis/logging");
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

  // keyboardArray.push([
  //   {
  //     text: 'Отмена',
  //     callback_data: `_cancel`,
  //   },
  // ])

  console.log(keyboardArray);

  return keyboardArray;
};