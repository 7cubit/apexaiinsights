package recon

import (
	"log"
	"net"
	"os"

	"github.com/oschwald/geoip2-golang"
)

type ASNLookup struct {
	db *geoip2.Reader
}

func NewASNLookup(dbPath string) (*ASNLookup, error) {
	// Check if file exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("Warning: GeoLite2-ASN.mmdb not found at %s. Using MOCK mode.", dbPath)
		return &ASNLookup{db: nil}, nil
	}

	db, err := geoip2.Open(dbPath)
	if err != nil {
		return nil, err
	}

	return &ASNLookup{db: db}, nil
}

func (a *ASNLookup) Close() {
	if a.db != nil {
		a.db.Close()
	}
}

func (a *ASNLookup) GetOrganization(ipStr string) (string, error) {
	if a.db == nil {
		// Mock logic for dev/demo if DB missing
		if ipStr == "8.8.8.8" {
			return "GOOGLE", nil
		}
		if ipStr == "1.1.1.1" {
			return "CLOUDFLARENET", nil
		}
		// Default mock for testing positive hits
		if ipStr == "12.34.56.78" {
			return "Tesla Motors Inc", nil
		}
		// Default mock for testing negative hits (ISP)
		if ipStr == "99.99.99.99" {
			return "Comcast Cable Communications", nil
		}
		return "Unknown ISP", nil
	}

	ip := net.ParseIP(ipStr)
	record, err := a.db.ASN(ip)
	if err != nil {
		return "", err
	}

	return record.AutonomousSystemOrganization, nil
}
