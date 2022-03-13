const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin, getRoomUsers,getCurrentUser, userLeave} = require('./utils/users')
var ghpages = require('gh-pages');

ghpages.publish('dist', function(err) {});

const port = 3000 || process.env.PORT

const app = express()
const server = http.createServer(app)
const io = socketio(server)
const botName = 'chatting bot'

app.use(express.static(path.join(__dirname,'public')));


io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
      socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        );
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });

    socket.on('chatMessage', msg=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room)('message',formatMessage( user.username,msg))
    })
    
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
    
        if (user) {
          io.to(user.room).emit(
            'message',
            formatMessage(botName, `${user.username} has left the chat`)
          );

          io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
          });
        }
      });
    });


server.listen(port, () => console.log(`Server running  on port ${port}!`))