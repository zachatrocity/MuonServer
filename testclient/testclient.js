
var form = document.querySelector('#input-form');

cloak.configure({
  messages: {
    'registerUsernameResponse': function(success) {
      console.log(success ? 'username registered' : 'username failed');
      // if we registered a username, try to join the lobby
      if (success) {
        // get the lobby
        cloak.message('joinLobby');
      }
    },

    'listUsersResponse': function(users) {
      console.log(users);
    }

  }
});

cloak.run('http://localhost:8090');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  var usernameinput = input.value;
  if (usernameinput.length < 1) {
    return;
  }
  createUsername(usernameinput);
  input.value = '';
});

function createUsername(name){
  cloak.message('registerUsername', { username: name});
}

