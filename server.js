var cloak = require('cloak');
var _ = require('underscore');

cloak.configure({
  port: 8090,
  roomLife: 1000*60*60*3,

  autoJoinLobby: false,
  minRoomMembers: 1,
  pruneEmptyRooms: 1000,
  reconnectWait: null,

  messages: {
    registerUsername: function(arg, user) {
      var users = cloak.getUsers();
      var username = arg.username;
      var usernames = _.pluck(users, 'name');
      var success = false;
      if (_.indexOf(usernames, username) === -1) {
        console.log('creating ', user)
        success = true;
        user.name = username;
        user.message('registerUsernameResponse', [success, username]);
      }else{
        console.log('resuming ', user)
        //resume so add back to the lobby
        var successadd = cloak.getLobby().addMember(user);
        user.message('joinLobbyResponse', successadd);
        if(successadd)
          cloak.messageAll('refreshAll');
      }
      console.log(users);
      console.log(usernames);
    },

    joinLobby: function(arg, user) {
      var users = cloak.getUsers();
      var usernames = _.pluck(users, 'name');
      if(_.indexOf(usernames, user.name) !== -1)
      {
        var success = cloak.getLobby().addMember(user);
        user.message('joinLobbyResponse', success);
        if(success)
          cloak.messageAll('refreshAll');
      }
    },

    listUsers: function(arg, user){
      if(user.room.getMembers != undefined){
      	user.message('refreshLobby', {
          users: user.room.getMembers(true),
          inLobby: user.room.isLobby,
          roomCount: user.room.getMembers().length,
          roomSize: user.room.size
        });
      }
    },

    listRooms: function(arg, user){
      user.message('refreshRooms', cloak.getRooms(true));
    },

    createRoom: function(arg, user) {
      var room = cloak.createRoom(arg.name, 2);
      var success = room.addMember(user);
      user.message('roomCreated', {
        success: success,
        roomId: room.id
      });
      cloak.messageAll('refreshAll');
    },

    joinRoom: function(id, user) {
      var room = cloak.getRoom(id)
      var memCount = room.getMembers().length;
      if (memCount < 2)
      {
        room.addMember(user);
        user.message('joinRoomResponse', {
          id: id,
          success: true
        });
      } else {
        user.message('joinRoomResponse', {
          id: id,
          success: false
        });
      }
      
    },

    leaveRoom: function(arg, user) {
      user.leaveRoom();
      user.delete();
    },

    disconnectUser: function(arg,user){
      console.log('deleting ', user);
      user.delete();
    },

    chat: function(msg, user) {
      user.getRoom().messageMembers('chat', [msg, user.name]);
    },

    refreshRoom: function(arg, user) {
      user.message('refreshRoomResponse', user.room.getMembers(true));
    },

    turnDone: function(move, user){
      //move[0] is from and move[1] is to
      // If it's currently the turn of the user and they say they're done, advance the turn
      if (user.team === user.room.turn) {
        user.room.turn = (user.room.turn === 'muon') ? 'antimuon' : 'muon';
      }
      // let the other player know
      var otherPlayer = _.reject(user.room.members, function(member) {
        return member.id === user.id;
      });
      console.log("sending move to player:", otherPlayer[0]);
      user.room.lastMove = {from: move[0], to: move[1]};
      otherPlayer[0].message('performOpponentMove', [move[0],move[1]]);

      user.room.messageMembers('turn', user.room.turn);

    }, 
    proposeDraw: function(arg, user){
      user.room.messageMembers('proposeDrawResponse', [user.name]);
    },
    respondToDraw: function(accept, user){
      user.room.messageMembers('respondToDrawResponse', [accept]);
    },
    proposeRematch: function(arg, user){
      user.room.messageMembers('proposeRematchResponse', [user.name]);
    },
    respondToRematch: function(accept, user){
      user.room.messageMembers('respondToRematchResponse', [accept]);
    }
  },

  room: {
    init: function() {
      this.turn = 'muon';
      this.lastMove = {};
      this.teams = {
        muon: '',
        antimuon: ''
      };
     
      console.log('created room ' + this.id);
      this.data.lastReportedAge = 0;
    },

    newMember: function(user) {
      if (this.teams.muon === '') { //host
        this.teams.muon = user.id;
        user.team = 'muon';
        user.message('userMessage', 'your are muons and your id is ' + user.id);
      }
      else if (this.teams.antimuon === '') { //client
        this.teams.antimuon = user.id;
        user.team = 'antimuon';
        user.message('userMessage', 'your team is antimuons and your id is ' + user.id);
      }
      else {
        var msg = 'Um, we tried to assign a team member but all teams were taken for this room.';
        console.log(msg);
        user.team = 'none';
        user.message('userMessage', msg);
      }
      user.message('assignTeam', {
        team: user.team,
        turn: this.turn
      });
    },

    memberLeaves: function(user) {
      if(user.team == 'muon')
        this.teams.muon = '';
      else if(user.team == 'antimuon')
        this.teams.antimuon = '';

      // if we have 0 people in the room, close the room
      if (this.getMembers().length <= 0) {
        this.delete();
        //refresh the lobby
        cloak.messageAll('refreshAll');
      }
    },

    pulse: function() {
      // add timed turn stuff here
    },

    close: function() {
      this.messageMembers('you have left ' + this.name);
    }

  }

});

cloak.run();
