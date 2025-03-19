const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZjlmMDM3Yi1kNTc4LTRiN2MtYjIyZC0xNmYxZTY5ZjNjYjkiLCJlbWFpbCI6ImNxZnkwMDI4MUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNmVhYjZjOTgyMGY4YjJiMTk2ZGMiLCJzY29wZWRLZXlTZWNyZXQiOiIyNGIxNzY3OTUyOTQ0NmNiMzNjMzU1ODFiNjVkOGNmYWRiMzk0M2Q0ZDNiYTk2Y2I5N2NkODM3ODA3ZjIzNDE5IiwiZXhwIjoxNzczODkwMzg3fQ.u3RrdpUv8XkfC_UKx-XdkrJy5jCgerc32F6EsaYh21k";

async function upload() {
  try {
    const formData = new FormData();

    const file = new File(["hello"], "Testing.png", { type: "image/png" });
    console.log(file);
    formData.append("file", file);

    formData.append("network", "public");

    const request = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });
    const response = await request.json();
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

upload();