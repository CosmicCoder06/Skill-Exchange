import LoginComponent from "../../Components/Login Component/loginComponent";

function LoginPage({ onLogin, onCreateAccount }) {
    return (
        <LoginComponent
            onLogin={onLogin}
            onCreateAccount={onCreateAccount}
        />
    );
}

export default LoginPage;
// @teamcosmiccoders
