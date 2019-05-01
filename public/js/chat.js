const socket= io()


// socket.on('countUpdated',(count)=>{
//     console.log('The count has been updated',count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('click')
//     socket.emit('increment')
// })

//elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton =$messageForm.querySelector('button')
const $sendLocationButton =document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
//const $location =document.querySelector('#location')
//templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML
//options

const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message',(msg)=>{
    console.log(msg)
    const html=Mustache.render(messageTemplate,{
        username:msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const locationhtml=Mustache.render(locationTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',locationhtml)
    autoscroll()
})

socket.on('roomdata',({room,users})=>{
   const html=Mustache.render(sidebarTemplate,{
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    
    const msg=e.target.elements.message.value
    socket.emit('sendMessage',msg,(error)=>{
        $messageFormInput.value=''
        $messageFormInput.focus()
        $messageFormButton.removeAttribute('disabled')
        if(error){
            return console.log(error)
        }
        console.log('The message was deliered')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
       
        let latitude=position.coords.latitude
        let longitude=position.coords.longitude
        const coordinates={
            latitude,
            longitude
        }
        socket.emit('sendLocation',coordinates,(msg)=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log(msg)
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})