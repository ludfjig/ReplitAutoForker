"use strict";

(async function () {

  await new Promise(resolve => setTimeout(resolve, 3000)); // let page load

  let i = 0;
  while (!document.querySelector(".css-1c2u65d")) {
    console.log("Unable to find parent element, trying again in 1 second.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (i >= 10) {
      console.log("Timed out. Please try refreshing the page.")
      return;
    }
    i++;
  }


  const ids = [];

  let s = document.getElementById("__NEXT_DATA__");
  let m = s.text.match('Repl:([^\"]+)\"');
  let t = s.text.match('\"title\":\"([^\"]+)\"');
  let replitId = m[1];
  let replitTitle = t[1];

  let forkButton = document.createElement("button");
  forkButton.id = "forkBtn";
  forkButton.disabled = true;
  forkButton.textContent = "Fork";
  forkButton.addEventListener("click", () => fork(replitId));

  let numForks = document.createElement("input");
  numForks.type = "number";
  numForks.placeholder = "number of forks";
  numForks.id = "numb";
  numForks.addEventListener("change", () => forkButton.disabled = false);

  let urlButton = document.createElement("button");
  urlButton.disabled = true;
  urlButton.textContent = "Get shareable URLs";
  urlButton.id = "getlinks";
  urlButton.addEventListener("click", getLink);

  let historyButton = document.querySelector(".css-1c2u65d");
  historyButton.after(numForks);
  numForks.after(forkButton);
  forkButton.after(urlButton);



  async function fork(replitId) {
    ids.length = 0;
    document.getElementById("forkBtn").disabled = true;
    const numForks = document.getElementById("numb").value;

    for (let i = 0; i < numForks; i++) {
      if (i > 0 && i % 5 == 0) {
        console.log("waiting 30s to avoid rate limiting...")
        await new Promise(resolve => setTimeout(resolve, 30000)); // avoid server error
      }

      try {
        let res = await fetch("https://replit.com/graphql", {
          "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9,sv;q=0.8",
            "content-type": "application/json",
            "sec-ch-ua": "Replit Auto Forker",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
          },
          "body": "[{\"operationName\":\"ForkReplCreateRepl\",\"variables\":{\"input\":{\"originId\":\"" + replitId + "\",\"teamId\":null,\"title\":\"" + replitTitle + "\",\"forkToPersonal\":true}},\"query\":\"mutation ForkReplCreateRepl($input: CreateReplInput!) {\\n  createRepl(input: $input) {\\n    ... on Repl {\\n      id\\n      url\\n      isPrivate\\n      language\\n      origin {\\n        id\\n        isOwner\\n        __typename\\n      }\\n      source {\\n        release {\\n          id\\n          repl {\\n            id\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    ... on UserError {\\n      message\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]",
          "method": "POST",
          "mode": "cors",
          "credentials": "include",
        });
        await statusCheck(res);
        res = await res.json();
        const id = res[0].data.createRepl.id;
        ids.push(id);
      } catch (err) {
        handleError(err);
      }
    } 
    document.getElementById("getlinks").disabled = false;
  }

  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  function handleError() {
    console.error("ERROR couldn't fork replits or couldn't get invite links");
  }

  async function getLink() {
    document.getElementById("getlinks").disabled = true;
    const urls = [];
    for (let id of ids) {
      let res = await fetch("https://replit.com/graphql", {
        "headers": {
          "accept": "*/*",
          "content-type": "application/json",
          "sec-ch-ua": "Replit Auto Forker",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest"
        },
        "body": "[{\"operationName\":\"MultiplayerRefreshInviteUrl\",\"variables\":{\"replId\":\"" + id + "\"},\"query\":\"mutation MultiplayerRefreshInviteUrl($replId: String!) {\\n  refreshMultiplayerInviteLink(replId: $replId) {\\n    id\\n    ... on Repl {\\n      id\\n      inviteUrl\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}]",
        "method": "POST",
        "mode": "cors",
        "credentials": "include",
      });
      await statusCheck(res);
      res = await res.json();
      const url = res[0].data.refreshMultiplayerInviteLink.inviteUrl;
      urls.push("https://replit.com" + url);
      await new Promise(resolve => setTimeout(resolve, 1000)); // avoid server error

    }

    let string = "";
    for (let i = 0; i < urls.length; i++) {
      console.log(urls[i]);
      string += urls[i] + "\n";
    }
    await window.navigator.clipboard.writeText(string);
  }

})();
