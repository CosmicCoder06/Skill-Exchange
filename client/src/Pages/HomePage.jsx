import "./HomePage.css";
import "./Landing.css";

function HomePage({ onDiscover, onProfile, onMessages, publicMode = false, onLogin, onRegister }) {
    return <main className="home-page">
        <nav className="app-nav">
            <button className="app-logo" onClick={onDiscover}><span>↗</span> SkillExchange</button>
            {
            publicMode ? <div className="public-nav-actions">
                <button className="home-text-button" onClick={onLogin}>Log in</button>
                <button className="nav-join" onClick={onRegister}>Join free <span>→</span></button>
                </div> : <><div className="nav-links">
                    <button onClick={onDiscover}>Discover</button>
                    <button onClick={onMessages}>Messages</button>
                    <button onClick={onProfile}>Profile</button></div>
                    <button className="nav-profile" onClick={onProfile}>My space <span>→</span></button>
                    </>}
                    </nav>
        <section className="home-hero"><div className="hero-copy"><p className="home-kicker">PEER-TO-PEER LEARNING</p><h1>Learn skills from people who <em>get it.</em></h1><p className="home-lead">Find the right mentor, share what you know, and turn curiosity into progress with a learning community built around real exchange.</p><div className="hero-actions"><button className="home-primary" onClick={publicMode ? onRegister : onDiscover}>{publicMode ? "Start your journey" : "Find a mentor"} <span>→</span></button><button className="home-text-button" onClick={publicMode ? onLogin : onProfile}>{publicMode ? "I already have an account" : "Build your profile"}</button></div><div className="hero-trust"><span>✦</span><p><b>Skills are better shared.</b><br />Connect, schedule, learn.</p></div></div><div className="hero-art"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-card hero-card-main"><p>THIS WEEK</p><strong>Grow your network</strong><div className="mini-avatars"><i>J</i><i>M</i><i>A</i><span>+48 learners</span></div></div><div className="hero-card hero-card-float"><span>✦</span><p>Every skill has a starting point.</p></div></div></section>
        <section className="home-strip"><p>ONE PLACE TO</p><div><span>Discover</span><i>·</i><span>Exchange</span><i>·</i><span>Grow</span></div></section>
        <section className="home-path"><div><p className="home-kicker">HOW IT WORKS</p><h2>A better way to learn together.</h2></div><div className="path-grid"><article><b>01</b><h3>Discover people</h3><p>Find mentors and learners by the skills that matter to you.</p></article><article><b>02</b><h3>Plan a session</h3><p>Use availability to start a useful, focused learning exchange.</p></article><article><b>03</b><h3>Keep growing</h3><p>Message directly, share feedback, and build trusted connections.</p></article></div></section>
        <section className="home-cta"><div><p className="home-kicker">YOUR NEXT STEP</p><h2>Put your skills in motion.</h2></div><button className="home-primary" onClick={onDiscover}>Explore the community <span>→</span></button></section>
    </main>;
}
export default HomePage;
// @teamcosmiccoders
