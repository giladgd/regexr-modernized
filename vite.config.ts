import {readFile} from "node:fs/promises";
import mixins from "@csstools/postcss-mixins";
import {defineConfig} from "vite";
import pkg from "./package.json" with {type: "json"};
import {renderLinks, repositoryUrl} from "./src/links.ts";
import {enLang} from "./src/lang/en.ts";

function english(key: string) {
    if (!Object.hasOwn(enLang, key)) {
        throw new Error("Missing English text for " + key);
    }
    return enLang[key as keyof typeof enLang];
}

export default defineConfig({
    root: "src",
    publicDir: "../public",
    plugins: [{
        name: "english-html",
        transformIndexHtml: {
            order: "pre",
            handler(html) {
                return html.replace('href="{{repositoryUrl}}"', 'href="' + repositoryUrl + '"')
                    .replace(/data-lang="(\w+)">(?=<\/)/g, (tag, key: string) => tag + renderLinks(english(key), enLang))
                    .replace(/data-lang-(aria-label|title|placeholder|content)="(\w+)"/g, (tag, attr: string, key: string) =>
                        tag + " " + attr + '="' + english(key).replaceAll("&", "&amp;")
                            .replaceAll('"', "&quot;") + '"');
            }
        }
    }, {
        name: "initial-theme",
        apply: "build",
        transformIndexHtml(html) {
            return html.replace('<script type="module"', '<script blocking="render" type="module"');
        }
    }, {
        name: "project-license",
        async generateBundle() {
            const source = await readFile(new URL("./LICENSE", import.meta.url));
            this.emitFile({type: "asset", fileName: "LICENSE.txt", source});
        }
    }],
    css: {postcss: {plugins: [mixins()]}},
    define: {
        __VERSION__: JSON.stringify(process.env.RELEASE_VERSION || pkg.version),
        __BUILD_DATE__: JSON.stringify(new Date().toISOString()
            .slice(0, 10))
    },
    build: {
        rolldownOptions: {input: ["src/index.html", "src/404.html"]},
        outDir: "../dist",
        emptyOutDir: true,
        license: {fileName: "assets/third-party-licenses.md"}
    },
    worker: {format: "es"}
});
