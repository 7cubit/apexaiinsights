package recon

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"strings"
)

type ISPFilter struct {
	Blacklist []string
}

func NewISPFilter(path string) *ISPFilter {
	filter := &ISPFilter{
		Blacklist: []string{}, // Empty default
	}

	// Load from file if exists
	if _, err := os.Stat(path); err == nil {
		data, err := ioutil.ReadFile(path)
		if err != nil {
			log.Printf("Error loading ISP blacklist: %v", err)
			return filter
		}
		var list []string
		if err := json.Unmarshal(data, &list); err != nil {
			log.Printf("Error parsing ISP blacklist: %v", err)
			return filter
		}
		filter.Blacklist = list
		log.Printf("Loaded %d ISP filters", len(list))
	} else {
		log.Printf("Warning: ISP blacklist not found at %s", path)
	}

	return filter
}

func (f *ISPFilter) IsISP(orgName string) bool {
	lowerOrg := strings.ToLower(orgName)
	for _, term := range f.Blacklist {
		if strings.Contains(lowerOrg, term) {
			return true
		}
	}
	return false
}
