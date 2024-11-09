import { _decorator, Component, Label, Node, Button, EventTouch } from 'cc';
import { setMockChannel, initBiu, login, doAuth, preparePayment, startPayment, getChannelName } from '@paygo-biu/minigame-sdk';
import { getConfigEnv, setConfigEnv } from './GameEnv';
const { ccclass, property } = _decorator;


@ccclass('Platform')
export class Platform extends Component {

    @property(Label)
    private userLabel: Label = null;

    userId: string = '';
    paymentId: string = '';

    start() {
        // setConfigEnv('dev');
        this.userLabel.string = "abc";
        initBiu();
        // setMockChannel({
        //     appId: 'demogame',
        //     uids: ["test_uid_1", "test_uid_2"],
        // });
    }

    update(deltaTime: number) {
    }

    async callLogin() {
        try {
            const loginResult = await login();
            if (loginResult.isTemporary) {
                this.userLabel.string = `User: ${loginResult.tempUserId}, isTemporary: ${loginResult.isTemporary}`;
            } else {
                const data = await this.doLoginToServer(loginResult.authCode);
                this.userId = data.userId;
                this.userLabel.string = `User: ${data.userId}`;
            }
        } catch (error) {
            console.error('callLogin error', error);
        }

    }

    async callAuth() {
        const { authCode } = await doAuth();
        const data = await this.doLoginToServer(authCode);
        this.userId = data.userId;
        this.userLabel.string = `User: ${this.userId}`;
    }

    async callPay(e: EventTouch, customData: string) {
        const button = e.target as Button;
        console.log('Button custom data:', customData);
        const { payment_id, action } = await this.startPay(customData);
        this.paymentId = payment_id;
        await startPayment({ action });
    }

    async callQueryPaymentResult() {
        const result = await this.queryPaymentResult();
        console.log('callQueryPaymentResult', result);
        this.userLabel.string = `支付结果: ${result.is_finished ? result.result : '未完成'}`;
    }

    async callTestStorage() {
        localStorage.clear()
        let i = 0;
        const testStr = 'a'.repeat(1024);
        for (i = 0; i < 10 * 1024; i++) {
            try {
                localStorage.setItem(`test_${i}`, testStr);
            } catch (error) {
                console.error(`callTestStorage error: ${i}`, error);
                this.userLabel.string = `callTestStorage error: ${i}, total: ${(i + 1) / 1024} MB`;
                break;
            }
        }
    }

    async callTestNetwork() {
        fetch('https://ipinfo.io/json').then(res => {
            return res.json();
        }).then(data => {
            console.log('callTestNetwork', data);
            this.userLabel.string = `callTestNetwork: ${data.ip}`;
        }).catch(error => {
            console.error('callTestNetwork error', error);
            this.userLabel.string = `callTestNetwork error: ${error}`;
        })
    }

    async doLoginToServer(authCode: string) {
        const response = await fetch(`${getConfigEnv().API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channel: getChannelName(),
                auth_code: authCode
            })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    async startPay(expectResult: string): Promise<{ payment_id: string, action: string }> {
        const { paymentPrepare } = await preparePayment();
        let payRequest = {
            user_id: this.userId,
            channel: getChannelName(),
            amount: 100,
            client_prepare: paymentPrepare,
            result: expectResult
        }
        const response = await fetch(`${getConfigEnv().API_URL}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payRequest)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    async queryPaymentResult(): Promise<{ is_finished: boolean, result: string }> {
        const response = await fetch(`${getConfigEnv().API_URL}/payment/${this.paymentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }
}

