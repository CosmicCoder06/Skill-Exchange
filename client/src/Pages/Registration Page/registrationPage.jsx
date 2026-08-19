import Register from "../../Components/Registration Component/registrationFormComponent";

function RegistrationPage({ onBackToLogin, onRegistered }) {
    return (
        <Register
            onBackToLogin={onBackToLogin}
            onRegistered={onRegistered}
        />
    );
}

export default RegistrationPage;
