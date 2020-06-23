import {initializeBlock, useGlobalConfig, useBase, useSynced, Loader, Button, Box, FormField, Input, Heading, Text, Link, Select} from '@airtable/blocks/ui';
import React, {Fragment, useState} from 'react';

const TABLE_NAME = 'Articles';

function BingSearchBlock() {
  const base = useBase();
  const table = base.getTableByName(TABLE_NAME);

  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  async function onButtonClick() {
    setIsUpdateInProgress(true);
    const recordsSearch = await getBingResults(apiKey,searchQuery,searchCountry,searchFreshness,searchCount);
    await createRecords(table, recordsSearch, searchQuery);
    setIsUpdateInProgress(false);
  }

  const [value, setValue] = useState("");

  const [apiKey, setApiKey, canSetApiKey] = useSynced('apiKey');
  const [searchQuery, setSearchQuery, canSetSearchQuery] = useSynced('searchQuery');
  const [searchCountry, setSearchCountry, canSetSearchCountry] = useSynced('searchCountry');
  const [searchFreshness, setSearchFreshness, canSetSearchFreshness] = useSynced('searchFreshness');
  const [searchCount, setSearchCount, canSetSearchCount] = useSynced('searchCount');

  return (
    <Box
        position="absolute"
        top="1"
        bottom="1"
        left="2"
        right="2"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
    >
    {isUpdateInProgress ? (
      <Loader />
    ) : (
      <Fragment>
      <Heading>Search for news and add results to Airtable</Heading>
      <Text>Use Bing News Search API to search the web for news articles.</Text>
      <Link marginTop="10px" marginBottom="10px" href="https://azure.microsoft.com/en-us/services/cognitive-services/bing-news-search-api/" target="_blank">
        Get your API key
      </Link>
      <FormField label="Cognitive API key">
        <Input value={apiKey} onChange={e => setApiKey(e.target.value)} disabled={!canSetApiKey} placeholder="Bing API key"/>
      </FormField>
      <FormField label="Search">
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} disabled={!canSetSearchQuery} placeholder="Search query term. If empty returns the top news stories."/>
      </FormField>
      <FormField label="Country">
        <Input value={searchCountry} onChange={e => setSearchCountry(e.target.value)} disabled={!canSetSearchCountry} placeholder="A 2-character country code of the country where the results come from"/>
      </FormField>
      <FormField label="Freshness">
        <Input value={searchFreshness} onChange={e => setSearchFreshness(e.target.value)} disabled={!canSetSearchFreshness} placeholder="day for last 24 hours, week for last 7 days, month for last 30 days"/>
      </FormField>
      <FormField label="Max results">
        <Input value={searchCount} onChange={e => setSearchCount(e.target.value)} disabled={!canSetSearchCount} placeholder="Default is 10 and the maximum value is 100"/>
      </FormField>

        <Button
          variant="primary"
          onClick={onButtonClick}
          marginBottom={3}
        >
          Search news
        </Button>
      </Fragment>
    )}
  </Box>
  );
}

async function getBingResults(apiKey,searchQuery,searchCountry,searchFreshness,searchCount) {

  let headers = {
    'Accept': 'application/json',
    "ocp-apim-subscription-key": apiKey,
  };

  const fetchUrl = 'https://api.cognitive.microsoft.com/bing/v7.0/news/search?count='+searchCount+'&freshness='+searchFreshness+'&cc='+searchCountry+'&q='+searchQuery;
  let response = await fetch(fetchUrl, {
    method: 'get',
    headers: headers,
    mode: 'cors',
    cache: 'no-store',
    referrer: 'http://airtable.com',
    referrerPolicy: 'origin-when-cross-origin',
    referrerPolicy: 'origin',
  })
  return response.json();
}

async function createRecords(table, recordsSearch, searchQuery) {
  if (recordsSearch && recordsSearch.value) {
    const searchItems = recordsSearch.value
    console.log('searchItems.length', searchItems.length)
    // Create records from Bing search results
    let i = 0;
    while (i < searchItems.length) {

      console.log('searchItem', searchItems[i])
      // Status is a single select field. Value must be an object with at least one of 'id' or 'name' as a property.

      const recordId = await table.createRecordAsync({
        'Published at': searchItems[i].datePublished,
        'Source': searchItems[i].provider[0].name,
        'Title': searchItems[i].name,
        'Thumbnail': searchItems[i].image ? [{url:searchItems[i].image.thumbnail.contentUrl}]: undefined,
        'Description': searchItems[i].description,
        'Link': searchItems[i].url,
        'Status': {name: 'New'},
        'Query': searchQuery
      });
      i++;
    }
  }
}

initializeBlock(() => <BingSearchBlock />);
