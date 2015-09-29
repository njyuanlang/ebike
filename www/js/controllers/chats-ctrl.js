controllers

.controller('ChatsCtrl', function ($scope, $state, Message, RemoteStorage) {
  
  Message.chats(function (results) {
    $scope.chats = results;
    results.forEach(function (item) {
      RemoteStorage.getAvatar(item._id).success(function (buffer) {
        item.avatar = buffer;
      });
    });
  });
})