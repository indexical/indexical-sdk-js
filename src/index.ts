import semver from "semver";

export function extractSourcesFromPackageJSON(input: string | object): {
  npm: string[];
} {
  const json: {
    dependencies: { [key: string]: string } | undefined;
  } = typeof input === "string" ? JSON.parse(input) : input;
  const dependencies = Object.entries(json.dependencies ?? {}).map(
    ([pkg, version]) => {
      try {
        return `${pkg}@${semver.minVersion(version)}`;
      } catch (e) {
        return pkg;
      }
    }
  );
  return {
    npm: dependencies,
  };
}

export function extractSourcesFromPackageLockJSON(input: string | object): {
  npm: string[];
} {
  const json: {
    packages: { [key: string]: any } | undefined;
  } = typeof input === "string" ? JSON.parse(input) : input;

  const packages = json.packages;

  if (!packages) {
    throw "Invalid package-lock.json contents";
  }

  const root = packages[""];
  const dependencies = Object.keys(root.dependencies);

  return {
    npm: dependencies.map((dep) => {
      const entry = packages[dep] ?? packages[`node_modules/${dep}`];
      if (entry && entry.version) {
        return `${dep}@${entry.version}`;
      } else {
        try {
          return `${dep}@${semver.minVersion(root.dependencies[dep])}`;
        } catch (e) {
          return dep;
        }
      }
    }),
  };
}

export function extractSourcesFromJS(input: string): { npm: string[] } {
  // Source: https://github.com/antonkc/MOR/tree/main/matchJsImports.md
  const IMPORT_REGEX =
    /(?<=(?:[\s\n;])|^)(?:import[\s\n]*((?:(?<=[\s\n])type)?)(?=[\n\s\*\{])[\s\n]*)((?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?(?=(?:[\n\s]*,[\n\s]*[\{\*])|(?:[\n\s]+from)))?)[\s\n,]*((?:\*[\n\s]*(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*))(?=[\n\s]+from))?)[\s\n,]*((?:\{[n\s]*(?:(?:[_\$\w][_\$\w0-9]*)(?:[\s\n]+(?:as[\s\n]+(?:[_\$\w][_\$\w0-9]*)))?[\s\n]*,?[\s\n]*)*\}(?=[\n\s]*from))?)(?:[\s\n]*((?:from)?))[\s\n]*(?:["']([^"']*)(["']))[\s\n]*?;?/g;

  const DYNAMIC_IMPORT_REGEX =
    /(?:\s|^)import\((?:["'\s]*([\w*{}\n\r\t, ]+)\s*)?["'\s](([@\w_-]+))["'\s].*\)/gm;

  const REQUIRE_REGEX =
    /(?:\s|^)require\((?:["'\s]*([\w*{}\n\r\t, ]+)\s*)?["'\s](([@\w_-]+))["'\s].*\)/gm;

  let pkgs = new Set<string>();

  let result;
  while ((result = IMPORT_REGEX.exec(input)) !== null) {
    const pkg = result[6];
    if (pkg.startsWith(".") || pkg.startsWith("/")) {
      continue;
    }
    pkgs.add(result[6]);
  }
  while ((result = DYNAMIC_IMPORT_REGEX.exec(input)) !== null) {
    const pkg = result[2];
    if (pkg.startsWith(".") || pkg.startsWith("/")) {
      continue;
    }
    pkgs.add(result[2]);
  }
  while ((result = REQUIRE_REGEX.exec(input)) !== null) {
    const pkg = result[2];
    if (pkg.startsWith(".") || pkg.startsWith("/")) {
      continue;
    }
    pkgs.add(result[2]);
  }

  return {
    npm: [...pkgs],
  };
}
