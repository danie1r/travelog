import { Tabs } from "wxt/browser";
import { parseToOpenAI } from "@/entrypoints/utils/helper";
import { PageInfo, Place } from "@/types/baseTypes";

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await browser.tabs.query(queryOptions);
  return tab;
}

async function sendTabInfo(msg: string) {
  const tab = await getCurrentTab();
  if (tab.id) {
    let message = {};
    switch (msg) {
      case "app_opened":
        message = {
          type: 'message', timestamp: Date.now(), 
          action: msg,
          id: tab.id,
          url: tab.url,
          title: tab.title,
        };
        break;
      case "stop_track":
        message = {
          type: 'message', timestamp: Date.now(), 
          action: msg,
        };
    }
    browser.tabs.sendMessage(tab.id, message);
  }
}

function logVisitedUrl(url: string) {
  browser.storage.local
    .get("visited")
    .then((result) => {
      const logs: string[] = result.visited;
      logs.push(url);
      browser.storage.local
        .set({ visited: logs })
        .then(() => {
          console.log("Data successfully saved.");
        })
        .catch((error) => {
          console.error("Error saving data:", error);
        });
    })
    .catch((error) => {
      console.error("Error retrieving url logs:", error);
    });
}

async function checkVisitState(url: string) {
  try {
    const response = await browser.storage.local.get("visited");
    const logs: string[] = response.visited;
    return logs.includes(url);
  } catch (e) {
    console.error("Error checking visited sites: ", e);
  }
}

async function searchVisitedPlaces(link: string) {
  try {
    const response = await browser.storage.local.get("recentItems");
    const places: Place[] = response.recentItems;
    const matched = places.filter((place) => {
      return place.link && place.link === link;
    });
    return matched;
  } catch (e) {
    console.error("Error fetching recent places: ", e);
  }
}

function parseHTML(data: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  function extractText(node: Node) {
    let text = "";
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent + " ";
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        child.nodeName !== "SCRIPT" &&
        child.nodeName !== "STYLE"
      ) {
        text += extractText(child) + " ";
      }
    }
    return text.trim();
  }

  return extractText(doc.body);
}

async function parseWebsite(tab: Tabs.Tab, tabId: number): Promise<Place[]> {
  const openai = parseToOpenAI();
  const result = await browser.scripting
    .executeScript({
      target: { tabId: tabId },
      injectImmediately: true, // uncomment this to make it execute straight away, other wise it will wait for document_idle
      func: DOMtoString,
      args: ["body"], // you can use this to target what element to get the html for
    })
    .then(async function (results) {
      const response = parseHTML(results[0].result);
      const parsed = await openai.startParsing(response, tab.title, tab.url);
      // currentInfo.places = parsed;
      // isLoading.value = false;
      // contentLoaded.value = true;
      // browser.runtime.sendMessage({ action: "save_recents", data: parsed });
      return parsed;
    })
    .catch(function (error) {
      console.log(`Error: ${error}`);
      return [];
    });
  if (result) {
    return result;
  }
  return [];
}

function DOMtoString(selector: any) {
  if (selector) {
    selector = document.querySelector(selector);
    if (!selector) return "ERROR: querySelector failed to find node";
  } else {
    selector = document.documentElement;
  }

  return selector.outerHTML;
}

async function getRecents() {
  try {
    const response = await browser.storage.local.get("recentItems");
    const recents = response.recentItems;
    return recents;
  } catch (e) {
    console.log("Error: " + e);
  }
}

function clearRecents() {
  browser.storage.local.set({ data: [] });
}

function saveRecents(items?: Place[]) {
  if (items) {
    browser.storage.local
      .get("recentItems")
      .then((result) => {
        let orig = result.recentItems || [];
        orig = orig.concat(items);
        browser.storage.local
          .set({ recentItems: orig })
          .then(() => {
            console.log("Data successfully saved.");
          })
          .catch((error) => {
            console.error("Error saving data:", error);
          });
      })
      .catch((error) => {
        console.error("Error retrieving data:", error);
      });
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "install") {
      browser.storage.local.set({ installDate: Date.now() });
      browser.storage.local.set({
      });
      browser.storage.local.set({
        recentItems: [],
        visited: [],
        savedItems: [],
      });
    }
  });

  browser.runtime.onMessage.addListener((msg, sender, send) => {
    if (msg.popupOpen) {
      sendTabInfo("app_opened");
    }
  });

  browser.runtime.onMessage.addListener(async (msg, sender, send) => {
    switch (msg.action) {
      case "stop_track":
        sendTabInfo("stop_track");
        browser.runtime.reload();
        break;
      case "remove_recents":
        clearRecents();
        break;
      case "get_recents":
        if (sender.tab && sender.tab.id) {
          const items = getRecents()
          const message = {
            type: 'message', timestamp: Date.now(), 
            action: "recents_received",
            content: items,
          }; // Message data

          browser.tabs.sendMessage(sender.tab.id, message);
        }
        break;
      // case 'get_contents':
      //   const tab = sender.tab
      //   if (tab && tab.url && tab.id) {
      //     const visitedStatus = await checkVisitState(tab.url);
      //     console.log("Visit status :" + visitedStatus)
      //     if (visitedStatus) {
      //       const visitedPlaces = await searchVisitedPlaces(tab.url);
      //       const message = {
      //         type: 'message', timestamp: Date.now(), 
      //         action: "display_parse_result",
      //         content: visitedPlaces,
      //       };
      //       console.log("Visited Message: " + message)
      //       browser.tabs.sendMessage(tab.id, message);
      //     } else {
      //       const items = await parseWebsite(tab, tab.id);
      //       const message = {
      //         type: 'message', timestamp: Date.now(), 
      //         action: "display_parse_result",
      //         content: items,
      //       };
      //       console.log("New Info: " + message)
      //       browser.tabs.sendMessage(tab.id, message);
      //       saveRecents(items);
      //     }
      //   }
    }
  });

  /** CONTEXT MENU SCRIPTS */
  browser.contextMenus.create({
    id: "place-search",
    title: "Search on Travelog",
    contexts: ["selection"],
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case "place-search":
        if (tab && tab.id) {
          console.log(info.selectionText);
          const message = {
            type: 'message', timestamp: Date.now(), 
            action: "search_element",
            content: info.selectionText,
          }; // Message data
          browser.tabs.sendMessage(tab.id, message);
          break;
        }
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.id){
      const visitedStatus = await checkVisitState(tab.url);
      console.log("Visit status :" + visitedStatus)
      if (visitedStatus) {
        const visitedPlaces = await searchVisitedPlaces(tab.url);
        const message = {
          type: 'message', timestamp: Date.now(), 
          action: "landed",
          content: visitedPlaces,
          id: tab.id,
          url: tab.url,
          title: tab.title,
        };
        console.log("Visited Message: " + message)
        browser.tabs.sendMessage(tab.id, message);
      } else {
        const items = await parseWebsite(tab, tab.id);
        const message = {
          type: 'message', timestamp: Date.now(), 
          action: "landed",
          content: items,
          id: tab.id,
          url: tab.url,
          title: tab.title,
        };
        console.log("New Info: " + message)
        browser.tabs.sendMessage(tab.id, message);
        saveRecents(items);
      }
    }
  });
});
