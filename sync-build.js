const { execSync } = require("child_process");

try {
  console.log("Running npm build...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("Switching to build-branch...");
  execSync("git checkout build-branch", { stdio: "inherit" });

  console.log("Copying build files...");
  // Asegúrate de limpiar la rama antes de copiar
  execSync("git rm -r --cached .", { stdio: "inherit" }); // elimina archivos versionados
  execSync("git add dist package.json package-lock.json", { stdio: "inherit" });

  console.log("Committing build...");
  execSync('git commit -m "Automated build commit [ci skip]"', {
    stdio: "inherit",
  });

  console.log("Pushing to build-branch...");
  execSync("git push origin build-branch", { stdio: "inherit" });

  console.log("Done! Build synced successfully ✅");
} catch (err) {
  console.error("Error syncing build:", err.message);
  process.exit(1);
}
