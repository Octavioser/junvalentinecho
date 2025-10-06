"use Sever";
import { loginAction } from "./login";
import style from './login.module.css';

const LoginFom = () => {

    return <div className={style.loginCotainer}>
        <form action={loginAction} className="w-full max-w-sm space-y-3">
            <div className={style.loginInputContainer}>
                <div>
                    <input
                        type="text"
                        name="eg"
                        autoFocus
                    />
                </div>
                <div>
                    <input
                        name="code"
                        autoFocus
                        pattern="\d*"
                    />
                </div>
                <button>로그인</button>
            </div>
        </form>
    </div>;
};
export default LoginFom;