// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
	globalIgnores(["server/*"]),
	eslint.configs.recommended,
	tseslint.configs.strict,
	tseslint.configs.stylistic,
	eslintConfigPrettier,
);
