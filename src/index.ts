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
    pkgs.add(pkg);
  }
  while ((result = DYNAMIC_IMPORT_REGEX.exec(input)) !== null) {
    const pkg = result[2];
    if (pkg.startsWith(".") || pkg.startsWith("/")) {
      continue;
    }
    pkgs.add(pkg);
  }
  while ((result = REQUIRE_REGEX.exec(input)) !== null) {
    const pkg = result[2];
    if (pkg.startsWith(".") || pkg.startsWith("/")) {
      continue;
    }
    pkgs.add(pkg);
  }

  return {
    npm: [...pkgs],
  };
}

export function extractSourcesFromPy(input: string): {
  pypi: string[];
} {
  const IMPORT_REGEX = /^\s*(?:from|import)\s+([\w.]+(?:\s*,\s*\w+)*)/gm;
  let pkgs = new Set<string>();

  let result;
  while ((result = IMPORT_REGEX.exec(input)) !== null) {
    const pkg_list = result[1];
    const pkg_list_split = pkg_list
      .split(",")
      .filter((p) => !(p.startsWith(".") || p.startsWith("/")))
      .map((p) => p.trim().split(".")[0]);
    for (const pkg of pkg_list_split) {
      pkgs.add(pkg);
      pkgs.add(pkg.replaceAll("_", "-"));
    }
  }

  return {
    pypi: [...pkgs],
  };
}

export function extractSourcesFromRequirementsTxt(input: string): {
  pypi: string[];
} {
  const PACKAGE_LINE_REGEX = /^[A-Za-z0-9]+.*/gm;
  let pkgs = new Set<string>();

  let result;
  while ((result = PACKAGE_LINE_REGEX.exec(input)) !== null) {
    const pkg_line = result[0];
    const VERSION_SPECIFIER_REGEX = /([=><!]+)\s*([0-9.*]+)/g;
    const PACKAGE_NAME_REGEX = /^([A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9])/;

    const pkg = PACKAGE_NAME_REGEX.exec(pkg_line)![0];

    if (/^[a-z]+:\/\//.test(pkg_line)) {
      continue;
    }

    if (pkg_line.includes("@")) {
      pkgs.add(pkg);
      continue;
    }

    let target = undefined;

    while ((result = VERSION_SPECIFIER_REGEX.exec(pkg_line)) !== null) {
      const [relation, version] = [result[1], result[2]];
      if (relation === "==" || relation.includes(">")) {
        target = version.replace("*", "0");
      }
    }

    pkgs.add(target ? `${pkg}@${target}` : pkg);
  }

  return {
    pypi: [...pkgs],
  };
}

// export function extractSourcesFromSetupPy(input: string): {
//   pypi: string[];
// } {

//   return {
//     pypi: [...pkgs],
//   };
// }

// export function extractSourcesFromPyprojectToml(input: string): {
//   pypi: string[];
// } {

//   return {
//     pypi: [...pkgs],
//   };
// }
