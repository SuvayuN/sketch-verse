import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import components
import * as Navbar from '../components/Navbar';
import GameCard from '../components/GameCard';

// Import avatar images
import luffy from '../assets/iconsAvatar/luffy.jpg';
import zoro from '../assets/iconsAvatar/zoro.jpeg';
import sanji from '../assets/iconsAvatar/sanji.jpg';
import nami from '../assets/iconsAvatar/nami.jpg';
import chopper from '../assets/iconsAvatar/chopper.jpeg';
import robin from '../assets/iconsAvatar/Robin.jpg';
import roger from '../assets/iconsAvatar/Roger.jpg';
import whitebeard from '../assets/iconsAvatar/Whitebeard.jpg';
import ace from '../assets/iconsAvatar/ace.jpeg';
import shanks from '../assets/iconsAvatar/shanks.jpeg';
import akainu from '../assets/iconsAvatar/akainu.jpg';
import pikachu from '../assets/iconsAvatar/pikachu.jpeg';
import guts from '../assets/iconsAvatar/guts.jpeg';
import vagabond from '../assets/iconsAvatar/vagabond.jpeg';

// Avatar images array
const images = [luffy, zoro, sanji, nami, chopper, robin, roger, whitebeard, ace, shanks, akainu, pikachu, guts, vagabond];

export default function Game() {
    // Set page title
    document.title = 'Sketch Verse | Game';

    // State variables
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState(luffy);
    const [showModal, setShowModal] = useState(false);
    const [gameId, setGameId] = useState('');
    const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0); // Track selected avatar
    const navigate = useNavigate();

    // Memoized function to handle creating a room
    const createRoom = () => {
        if (!username.trim()) {
            alert('Please enter a username!');
            return;
        }
        navigate(`/lobby?roomId=&username=${username}&avatar=${encodeURIComponent(avatar)}`);
    };

    // Memoized function to handle joining a game
    const joinGame = () => {
        if (!gameId.trim()) {
            alert('Please enter a game ID!');
            return;
        }
        navigate(`/lobby?roomId=${gameId}&username=${username}&avatar=${encodeURIComponent(avatar)}`);
    };

    // Function to handle selecting an avatar
    const selectAvatar = index => {
        setSelectedAvatarIndex(index);
    };

    // Update avatar when selected avatar index changes
    useEffect(() => {
        setAvatar(images[selectedAvatarIndex]);
    }, [selectedAvatarIndex]);

    const buildAvatars = (images, size) => {
        let avatars = images.map((image, index) => (
            <button key={index} className="border-2 border-transparent" onClick={() => selectAvatar(index)}>
                <img
                    id={`avatar-${index}`}
                    className="avatars m-1 border-4 border-transparent rounded-xl w-16 h-16
                    sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                    src={image}
                    alt="Avatar"
                />
            </button>
        ));

        const result = [];
        for (let i = 0; i < avatars.length; i += size) {
            result.push(
                <div key={i} className="flex justify-center flex-wrap">
                    {avatars.slice(i, i + size)}
                </div>,
            );
        }

        return result;
    };

    // Main Function to render
    return (
        <React.Fragment>
            <Navbar.FixedTopRight path="/" headline="Sketch Verse" />
            <motion.div
                className={`flex flex-col justify-center items-center h-screen w-full transition-all ${showModal ? 'blur-sm' : ''}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: -10 }}
                transition={{ duration: 0.5, delay: 0.3 }}>
                <motion.div
                    className="flex flex-col items-center justify-around h-[60%] w-[90%] sm:w-[50%] border-2 border-lime-500 rounded-3xl shadow-2xl shadow-black"
                    initial={{ backdropFilter: 'blur(0px)' }}
                    animate={{ backdropFilter: 'blur(10px)' }}
                    transition={{ duration: 2.5 }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.5 } }}>
                    <h3 className="text-center text-lime-500 font-bold text-3xl mt-5">Choose Avatar :</h3>
                    <div className="flex flex-col justify-center items-center mt-3 md:5">{buildAvatars(images, 5)}</div>

                    <div className="flex items-center justify-center my-5 mx-5">
                        <input
                            id="username"
                            className="w-[90%] focus:outline-none py-3 px-8 text-center bg-transparent border-b-2 border-lime-500 text-lime-500 font-bold placeholder:font-bold placeholder:text-lime-300 text-2xl mx-5"
                            type="text"
                            value={username}
                            onChange={e => {
                                const value = e.target.value;
                                if (value.length <= 20) {
                                    setUsername(value);
                                } else {
                                    alert('Username length should be maximum 20.');
                                }
                            }}
                            placeholder="Username"
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </div>

                    <div className="flex justify-center w-full">
                        <GameCard image={avatar} photoWidth={80} photoHeight={80} userName={username} usersPoints={0} />
                    </div>

                    <div className="flex justify-center my-5">
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-wrap mb-5 px-8 py-2 font-kota text-xl rounded-3xl bg-lime-500 text-black hover:bg-green-700 hover:text-white active:scale-90">
                            Join Game
                        </button>
                        <span className="m-3 text-lime-500 text-center text-lg font-kota"> Or </span>
                        <button
                            onClick={createRoom}
                            className="text-wrap mb-5 px-8 py-2 font-kota text-xl rounded-3xl bg-lime-500 text-black hover:bg-green-700 hover:text-white active:scale-90">
                            Create Room
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                        <h2 className="text-xl font-bold text-lime-500 mb-4">Enter Game ID</h2>
                        <input
                            type="text"
                            value={gameId}
                            onChange={e => setGameId(e.target.value)}
                            placeholder="Game ID"
                            className="p-2 border-2 border-lime-500 rounded-md focus:outline-none text-center text-black"
                        />
                        <div className="flex justify-center mt-4">
                            <button onClick={joinGame} className="px-6 py-2 mr-3 bg-lime-500 text-black font-bold rounded-xl hover:bg-green-700 hover:text-white">
                                Join
                            </button>
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 bg-gray-300 text-black font-bold rounded-xl hover:bg-gray-400">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
