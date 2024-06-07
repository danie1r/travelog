import { Tabs } from "wxt/browser";
// import openAIServiceInstance from "./utils/instance";
import { ParseReturn, Place } from "@/types/baseTypes";
import { parseDocument, DomUtils, ElementType } from "htmlparser2";
import { AnyNode } from "domhandler";

const travelRelatedTerms: string[] = [
  // Destinations
  "tourist destinations",
  "popular destinations",
  "travel spots",
  "vacation spots",
  "holiday destinations",
  // Accommodations
  "hotels",
  "hostels",
  "bed and breakfast",
  "vacation rentals",
  "resorts",
  "guesthouses",
  "lodges",
  "campsites",
  "boutique hotels",
  // Transportation
  "flights",
  "airlines",
  "airport transfers",
  "car rentals",
  "train tickets",
  "bus services",
  "taxi services",
  "ferry services",
  // Activities
  "sightseeing",
  "tours",
  "excursions",
  "adventures",
  "outdoor activities",
  "cultural experiences",
  "guided tours",
  "hiking",
  "diving",
  "skiing",
  "wildlife safaris",
  // Booking
  "reservations",
  "itinerary",
  // Planning
  "travel guide",
  "travel tips",
  "travel advice",
  "travel itinerary",
  "trip planner",
  "travel insurance",
  "visa information",
  "travel restrictions",
  "weather forecast",
  // Travel Types
  "family travel",
  "solo travel",
  "couple travel",
  "group travel",
  "luxury travel",
  "budget travel",
  "adventure travel",
  "eco travel",
  "business travel",
  // Regions and Areas
  "regions",
  "cities",
  "towns",
  "villages",
  "beaches",
  "mountains",
  "national parks",
  "historical sites",
  "cultural sites",
  "urban areas",
  "countryside",
  // User Engagement
  "travel blogs",
  "travel stories",
  "photo galleries",
  "travel videos",
  // Services and Amenities
  "breakfast included",
  "swimming pool",
  "fitness center",
  "spa services",
  "restaurant",
  "room service",
  "laundry service",
];

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
          type: "message",
          timestamp: Date.now(),
          action: msg,
          id: tab.id,
          url: tab.url,
          title: tab.title,
        };
        break;
      case "stop_track":
        message = {
          type: "message",
          timestamp: Date.now(),
          action: msg,
        };
        break;
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
  const doc = parseDocument(data);
  const body = DomUtils.findOne(
    (elem) => elem.tagName === "body",
    doc.children
  );
  function extractText(node: AnyNode) {
    let text = "";
    const children = DomUtils.getChildren(node) || [];
    for (const child of children) {
      if (child.type === ElementType.Text) {
        text += DomUtils.getText(child) + " ";
      } else if (
        child.type === ElementType.Tag &&
        child.tagName !== "script" &&
        child.tagName !== "style"
      ) {
        text += extractText(child) + " ";
      }
    }
    return text.trim();
  }
  return body ? extractText(body) : "";
}

async function parseWebsite(tab: Tabs.Tab, tabId: number): Promise<Place[]> {
  const result = await browser.scripting
    .executeScript({
      target: { tabId: tabId },
      injectImmediately: true, // uncomment this to make it execute straight away, other wise it will wait for document_idle
      func: DOMtoString,
      args: ["body"], // you can use this to target what element to get the html for
    })
    .then(async function (results) {
      const response = parseHTML(results[0].result);
      const scheme =
        "destinations: [{name: string, category: string, address: string, startDate?: Date, endDate?: Date, description?: string, coordinates?: GeolocationCoordinates}]";
      const data = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${import.meta.env.VITE_OPENAI_SECRET_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an document parser that only responds using the api below\ndocument:${scheme}`,
            },
            {
              role: "user",
              content: `Return an array of json object representing travel destinations parsed from the document at the end of the prompt. \n${response}`,
            },
          ],
          max_tokens: 4096,
          response_format: { type: "json_object" },
        }),
      });
      const parsed = await data.json();
      const res: ParseReturn = JSON.parse(parsed.choices[0].message.content);
      res.destinations.map((dest) => {
        dest.category = dest.category ? dest.category : "place";
        (dest.source = tab.title),
          (dest.link = tab.url),
          (dest.dateAccessed = new Date().toDateString());
      });
      return res.destinations;
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
  browser.storage.local.set({ recentItems: [] });
}

function clearRecentWebsiteLogs() {
  browser.storage.local.set({visited : []});
}

function saveRecents(items?: Place[]) {
  
  if (items) {
    items.map((item) => {
      console.log(item)
    })
    browser.storage.local
      .get("recentItems")
      .then((result) => {
        let orig = result.recentItems || [];
        orig = items.concat(orig);
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

async function checkWebsiteType(
  tab: Tabs.Tab,
  tabId: number
): Promise<boolean> {
  const result = await browser.scripting
    .executeScript({
      target: { tabId: tabId },
      injectImmediately: true, // uncomment this to make it execute straight away, other wise it will wait for document_idle
      func: DOMtoString,
      args: ["body"], // you can use this to target what element to get the html for
    })
    .then(async function (results) {
      const response: string = results[0].result;
      return travelRelatedTerms.some((word) =>
        response.toLowerCase().includes(word.toLowerCase())
      );
    })
    .catch(function (error) {
      console.log(`Error: ${error}`);
      return false;
    });

  return result;
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "install") {
      browser.storage.local.set({ installDate: Date.now() });
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
        break;
      case "remove_recents":
        clearRecents();
        clearRecentWebsiteLogs();
        break;
      case "get_recents":
        if (sender.tab && sender.tab.id) {
          const items = await getRecents();
          const message = {
            type: "message",
            timestamp: Date.now(),
            action: "recents_received",
            content: items,
          }; // Message data
          browser.tabs.sendMessage(sender.tab.id, message);
        }
        break;
    }
  });

  /** CONTEXT MENU SCRIPTS */
  browser.contextMenus.create({
    id: "search_element",
    title: "Search on Travelog",
    contexts: ["selection"],
  });
  browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case "search_element":
        if (tab && tab.id) {
          console.log("Searching the following text: " + info.selectionText);
          const message = {
            type: "message",
            timestamp: Date.now(),
            action: "search_element",
            content: info.selectionText,
            id: tab.id,
            url: tab.url,
            title: tab.title,
          }; // Message data
          browser.tabs.sendMessage(tab.id, message);
          break;
        }
    }
  });

  /** Triggered when new url reached */
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.id) {
      const isTravelSite = await checkWebsiteType(tab, tab.id);
      console.log("Is it a travel website: " + isTravelSite);
      if (isTravelSite) {
        // Check if visited
        const visitedStatus = await checkVisitState(tab.url);
        console.log("Visit status :" + visitedStatus);
        if (visitedStatus) {
          const visitedPlaces = await searchVisitedPlaces(tab.url);
          visitedPlaces?.map((item) => {
            console.log(item.dateAccessed)
          })
          const message = {
            type: "message",
            timestamp: Date.now(),
            action: "landed",
            content: visitedPlaces,
            id: tab.id,
            url: tab.url,
            title: tab.title,
          };
          console.log("Visited Message: " + message);
          browser.tabs.sendMessage(tab.id, message);
        } else {
          const items = await parseWebsite(tab, tab.id);
          logVisitedUrl(tab.url);
          if (items.length > 0) {
            const message = {
              type: "message",
              timestamp: Date.now(),
              action: "landed",
              content: items,
              id: tab.id,
              url: tab.url,
              title: tab.title,
            };
            console.log("New Info: " + items);
            browser.tabs.sendMessage(tab.id, message);
            items.map((item) => {
              console.log(item.dateAccessed)
            })
            saveRecents(items);
          }
        }
      }
    }
  });
});
