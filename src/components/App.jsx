import { BrowserRouter, Routes, Route, Link, NavLink} from 'react-router-dom';
import { Home } from './Home.jsx'
import { Shop } from './Shop.jsx'
import { Cart } from './Cart.jsx'
import { useState } from 'react';

export function App() {
  const [cards, setCards] = useState([]);

  const linkStyle = ({ isActive }) =>
    isActive
      ? "bg-amber-950 text-amber-400 px-4 py-2 rounded-full shadow-inner scale-105 transition-all duration-300 uppercase tracking-wider text-sm font-black"
      : "relative group text-amber-950 px-4 py-2 uppercase tracking-wider text-sm font-black transition-colors hover:text-white";

  const spanStyle = ({ isActive }) =>
    isActive
      ? "hidden" 
      : "absolute bottom-1 left-4 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-[calc(100%-2rem)]";

  return (
    <BrowserRouter>
      <nav className="sticky top-0 z-50 flex justify-center items-center gap-8 bg-amber-400 px-6 py-4 shadow-md foc">
        <NavLink to="/" className={linkStyle}>
            {({ isActive }) => (
                <>
                    Home
                    <span className={spanStyle({ isActive })}></span>
                </>
            )}
        </NavLink >

        <NavLink  
            to="/shop" 
            className={linkStyle}
        >
            {({ isActive }) => (
                <>
                    Shop
                    <span className={spanStyle({ isActive })}></span>
                </>
            )}
        </NavLink >

        <NavLink  
            to="/cart" 
            className={linkStyle}
        >
            {({ isActive }) => (
                <>
                    Cart
                    <span className={spanStyle({ isActive })}></span>
                </>
            )}
        </NavLink >
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop cards={cards} setCards={setCards} />} />
        <Route path="/cart" element={<Cart cards={cards} setCards={setCards}/>} />
      </Routes>
    </BrowserRouter>
  )
}