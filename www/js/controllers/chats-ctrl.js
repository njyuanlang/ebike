controllers

.controller('ChatsCtrl', function ($scope, $state, Message, RemoteStorage, $timeout) {
  
  var syncTimer = null;
  var syncDone = function () {
    if(syncTimer) {
      $timeout.cancel(syncTimer);
      syncTimer = null;
    }
    $scope.$broadcast('scroll.refreshComplete');
  }
  $scope.sync = function () {
    Message.chats(function (results) {
      $scope.chats = results;
      results.forEach(function (item) {
        RemoteStorage.getAvatar(item._id).success(function (buffer) {
          item.avatar = buffer;
        });
      });
      syncDone();
    }, function (reason) {
      syncDone();
    });
    
    syncTimer = $timeout(syncDone, 5000);
  }
  
  $scope.sync();
})