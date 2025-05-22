
const Header = () => {
  return(
    <header class="header">
      <h1 className="visually-hidden">Управление Рoботом</h1>
      <nav className="navigation">
        <a className="navigation-link"href="#"> ГЛАВНАЯ </a>
        <a className="navigation-link">О НАС</a>
        <div className="robot-id">
          <form className="robot-input">
            <p className="navigation-link">РОБОТ:</p>
            <input className="input-id" required placeholder="  ID"></input>
            <button className="button submit-button">OK</button>
          </form>
        </div>

      </nav>

    </header>
  );

}

export default Header;