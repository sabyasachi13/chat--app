const express =require('express');
const path = require('path')
const http = require('http')
const socketio=require('socket.io')
const Filter= require('bad-words')
const {generateMessage,generateLocationMessage}=require ('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')
const publicDirectory=path.join(__dirname,'../public')
const app=express()
const server =http.createServer(app)

const io=socketio(server)


const port =process.env.PORT || 3000
console.log(publicDirectory)

app.use(express.static(publicDirectory))
let count=0
io.on('connection',(socket)=>{
    console.log('new connection')
    // socket.emit('countUpdated',count)

    // socket.on('increment',()=>{
    //     count++
    //     //this will emit to a single node
    //     //socket.emit('countUpdated',count)
    //     io.emit('countUpdated',count)
    // })

    
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({ id:socket.id,username,room})
      
        if(error){
           return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','welcome!'))
        //socket.broadcast.emit('message',generateMessage('A new user has joined'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomdata',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage',(msg,callback)=>{
        const user=getUser(socket.id)
        
        const filter=new Filter()
        if(filter.isProfane(msg)){
            return callback('profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,msg))
        callback()
    })
    
    socket.on('sendLocation',(coordinates,callback)=>{
        const user=getUser(socket.id)
        
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`))
        callback('location shared')
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        console.log(user)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))

            io.to(user.room).emit('roomdata',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })


    
})
server.listen(port,()=>{
    console.log(`server is up on port ${port}`)
})