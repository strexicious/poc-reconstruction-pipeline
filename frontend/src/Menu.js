import { ReactComponent as MoreIcon } from "./icons/more-vertical.svg";
import "./Menu.css";

function Menu({ onClick, isOpen, menuButtons }) {
	return (
		<div className="menu-wrapper">	
			{isOpen &&
			<ul className="menu-dropdown">
				{menuButtons.map(b => <li onClick={b.action} key={b.text}>{b.text}</li>)}
			</ul>}
			<MoreIcon className="menu-open-button" onClick={onClick} />	
		</div>
	);
}

export default Menu;
