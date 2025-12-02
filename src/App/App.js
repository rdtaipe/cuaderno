import React from "react";

export default function App({ State, Action }) {
    return (
        <div className="App">
            <h1>
                {JSON.stringify(State)}
            </h1>
        </div>
    );
}