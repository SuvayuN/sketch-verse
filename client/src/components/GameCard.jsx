import React from 'react';
import PropTypes from 'prop-types';

export default function GameCard(props) {
    return (
        <React.Fragment>
            <div className={`${props.className} card flex bg-slate-800 border-4 border-lime-500 rounded-xl`}>
                <div id="userAvatar">
                    <img className="m-3 border-4 border-lime-500 rounded-xl" src={props.image} alt="" width={props.photoWidth} height={props.photoHeight} />
                </div>
                <div id="userDeatils" className="py-5 pr-5 pl-2 text-left">
                    <div id="userUsername" className="font-bold text-lime-500">
                        {props.userName === '' ? 'player456' : props.userName}
                    </div>
                    <div id="userPoints" className="font-bold text-lime-500">
                        {props.usersPoints !== undefined ? `Points: ${props.usersPoints}` : ''}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

GameCard.propTypes = {
    className: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    photoWidth: PropTypes.number.isRequired,
    photoHeight: PropTypes.number.isRequired,
    userName: PropTypes.string.isRequired,
    usersPoints: PropTypes.number,
};
