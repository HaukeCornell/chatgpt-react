import React, { useState, useRef, useEffect, useContext } from 'react';
import ChatMessage from './ChatMessage';
import { ChatContext } from '../context/chatContext';
import Thinking from './Thinking';
import { MdSend } from 'react-icons/md';
import Filter from 'bad-words';
import { davinci } from '../utils/davinci';
import { dalle } from '../utils/dalle';
import Modal from './Modal';
import Setting from './Setting';

/**
 * A chat view component that displays a list of messages and a form for sending new messages.
 */
const ChatView = () => {
  const messagesEndRef = useRef();
  const inputRef = useRef();
  const [formValue, setFormValue] = useState('');
  const [thinking, setThinking] = useState(false);
  const options = ['ChatGPT', 'DALL·E'];
  const [selected, setSelected] = useState(options[0]);
  const [messages, addMessage] = useContext(ChatContext);
  const [modalOpen, setModalOpen] = useState(false);
  // Style options and state
  const chatbotStyleOptions = ['woke', 'stereotypical', 'fact_checking', 'correct_response', 'science_denialism' , 'scientism', 'dogmatic_conservatism', 'radical_progressivism', 'far_left', 'far_right']; 
  const dalleStyleOptions = ['normal', 'stereotypical', 'diverse'];
  const [styleOptions, setStyleOptions] = useState(selected === options[0] ? chatbotStyleOptions : dalleStyleOptions);
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);

  /**
   * Scrolls the chat area to the bottom.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateMessage = (newValue, ai = false, selected, selectedStyle) => {
  const id = Date.now() + Math.floor(Math.random() * 1000000);

  /**
   * Adds a new message to the chat.
   *
   * @param {string} newValue - The text of the new message.
   * @param {boolean} [ai=false] - Whether the message was sent by an AI or the user.
   */
    const newMsg = {
      id: id,
      createdAt: Date.now(),
      text: newValue,
      ai: ai,
      selected: `${selected}`,
      style: `${selectedStyle}`, // Include selectedStyle in the message object
    };
    addMessage(newMsg);
  };

  const modifyPromptWithStyle = async (userInput, style) => {
    const key = window.localStorage.getItem('api-key');
  
    let instruction;
    switch (style) {
      // case 'normal':
      //   instruction = `You are an assistant that improves text that the user inputs for direct input in an image generation AI. 
      //   Explain the users input for more detail. 
      //   Do not add any extra explanatory text other than the direct image generation (descriptive text) prompt. This is what the user want to generate: ${userInput}`;
      //   break;
      // case 'stereotypical':
      //   instruction = `You are an educational assistant that modifies text that the user inputs to show what a stereotypical version of user input would be 
      //   for direct input in an image generation AI. 
      //   Explain the users input for more detail. 
      //   Do not add any extra explanatory text other than the direct image generation (descriptive text) prompt. This is what the user want to generate: ${userInput}`;
      //   break;
      // case 'diverse':
      //   instruction = `You are an educational assistant that modifies text that the user inputs to show what a diverse and inclusive version of user input would be 
      //   Explain the users input for more detail. 
      //   Do not add any extra explanatory text other than the direct image generation (descriptive text) prompt. This is what the user want to generate: ${userInput}`;
      //   break;
      case 'normal':
        instruction = `Describe the image of ${userInput} in three lines.`;
        break;
      case 'stereotypical':
        instruction = `Describe the image of a stereotypical version of ${userInput} in three lines.`;
        break;
      case 'diverse':
        instruction = `Describe the image of an diverse and inclusive version of ${userInput} in three lines.`;
        break;
      default:
        instruction = userInput;
    }
  
    const response = await davinci(instruction, key);
    const modifiedPrompt = response.data.choices[0].message.content;
    console.log(modifiedPrompt);
    return modifiedPrompt;
  };
  

  /**
   * Sends our prompt to our API and get response to our request from openai.
   *
   * @param {Event} e - The submit event of the form.
   */
  const sendMessage = async (e) => {
    e.preventDefault();

    const key = window.localStorage.getItem('api-key');
    if (!key) {
      setModalOpen(true);
      return;
    }

    const filter = new Filter();
    const cleanPrompt = filter.isProfane(formValue)
      ? filter.clean(formValue)
      : formValue;

    const newMsg = cleanPrompt;
    const aiModel = selected;

    setThinking(true);
    setFormValue('');
    updateMessage(newMsg, false, aiModel);

    console.log(selected);
    try {
      if (aiModel === options[0]) {
        const response = await davinci(cleanPrompt, key, selectedStyle);
        const data = response.data.choices[0].message.content;
        data && updateMessage(data, true, aiModel);
      } else {
        // const response = await dalle(cleanPrompt, key, selectedStyle);
        // const data = response.data.data[0].url;
        // data && updateMessage(data, true, aiModel);
        const modifiedPrompt = await modifyPromptWithStyle(cleanPrompt, selectedStyle);
        const response = await dalle(modifiedPrompt, key);
        const data = response.data.data[0].url;
        data && updateMessage(data, true, aiModel);
      }
    } catch (err) {
      window.alert(`Error: ${err} please try again later`);
    }

    setThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // 👇 Get input value
      sendMessage(e);
    }
  };

  useEffect(() => {
    if (selected === options[0]) {
      setStyleOptions(chatbotStyleOptions);
      setSelectedStyle(chatbotStyleOptions[0]); // Reset selected style
    } else {
      setStyleOptions(dalleStyleOptions);
      setSelectedStyle(dalleStyleOptions[0]); // Reset selected style
    }
  }, [selected]);
  
  /**
   * Scrolls the chat area to the bottom when the messages array is updated.
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  /**
   * Focuses the TextArea input to when the component is first rendered.
   */
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <div className='chatview'>
      <main className='chatview__chatarea'>
        {messages.map((message, index) => (
          <ChatMessage key={index} message={{ ...message }} />
        ))}

        {thinking && <Thinking />}

        <span ref={messagesEndRef}></span>
      </main>
      <form className='form' onSubmit={sendMessage}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className='dropdown'>
          <option>{options[0]}</option>
          <option>{options[1]}</option>
        </select>
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className='dropdown'>
          {styleOptions.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <div className='flex items-stretch justify-between w-full'>
          <textarea
            ref={inputRef}
            className='chatview__textarea-message'
            value={formValue}
            onKeyDown={handleKeyDown}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button
            type='submit'
            className='chatview__btn-send'
            disabled={!formValue}>
            <MdSend size={30} />
          </button>
        </div>
      </form>
      <Modal title='Setting' modalOpen={modalOpen} setModalOpen={setModalOpen}>
        <Setting modalOpen={modalOpen} setModalOpen={setModalOpen} />
      </Modal>
    </div>
  );
};

export default ChatView;
