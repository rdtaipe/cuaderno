import React from 'react'
import styled from 'styled-components'

import logo from '../assets/canvas-logo.svg'

export function CanvasHeader({ State }) {
    return (
        <Header style={{ height: State.Style.ButtonToolbarHeight }}>
            <Logo>
                {/* <CanvasIcon src={ico} alt="logo"/> */}
                <img src={logo} alt="logo" />

            </Logo>


        
        </Header>
    )
}
const Header = styled.header`
position: fixed;
top: 0px;
left: 0px;
width:100%!important;
background-color: #fff;
display: flex;
flex-direction: row;
align-items: center;
z-index: 9999;
overflow: hidden;
padding-left: 8px;
`
const Logo = styled.header`
position: relative;
display: flex;
align-items: center!important;


& img{
    height: 32px!important;
    padding-right: 4px;
}

`


