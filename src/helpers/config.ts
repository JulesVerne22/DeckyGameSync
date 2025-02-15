import { get_config, set_config } from "./backend";
import * as default_config from "../json/default_config.json";

class Config {
    private data = default_config;

    public async load(): Promise<void> {
        let backend_config = await get_config();
        for (let key in this.data) {
            if (key in backend_config) {
                try {
                    this.data[key] = backend_config.get(key);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    public get(key: string) {
        return this.data[key];
    }

    public set(key: string, value: any) {
        this.data[key] = value;
        set_config(key, value);
    }
}

const config = new Config();
await config.load();

export default config;