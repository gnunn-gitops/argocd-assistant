import * as React from "react";

require('./chat.scss');

const Chat = () => {

    return (
        <div className='chat'>
            <div className='chat-log'>
                <textarea name="chat-log" readOnly/>
            </div>
            <div className='chat-entry'>
                <input name="chat" /><button type="submit" className='argo-button argo-button--base'>Send</button>
            </div>
        </div>
    )
}

export default Chat;
