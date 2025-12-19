package recon

import (
	"net"
	"strings"
)

type ReconEngine struct {
	asnLookup *ASNLookup
	ispFilter *ISPFilter
}

type ReconResult struct {
	IP            string
	Organization  string
	IsISP         bool
	Hostname      string
	CompanyDomain string
}

func NewReconEngine(asnPath, blacklistPath string) (*ReconEngine, error) {
	asn, err := NewASNLookup(asnPath)
	if err != nil {
		return nil, err
	}
	filter := NewISPFilter(blacklistPath)

	return &ReconEngine{
		asnLookup: asn,
		ispFilter: filter,
	}, nil
}

func (r *ReconEngine) Identify(ip string) ReconResult {
	org, _ := r.asnLookup.GetOrganization(ip)
	if org == "" {
		org = "Unknown"
	}

	isISP := r.ispFilter.IsISP(org)

	result := ReconResult{
		IP:           ip,
		Organization: org,
		IsISP:        isISP,
	}

	// Only perform expensive lookups if NOT an ISP and NOT Unknown
	if !isISP && org != "Unknown" && org != "Unknown ISP" {
		// 1. Reverse DNS
		hostnames, err := net.LookupAddr(ip)
		if err == nil && len(hostnames) > 0 {
			result.Hostname = strings.TrimSuffix(hostnames[0], ".")

			// 2. Extract Domain (Basic Regex for root domain)
			// Matches domain.tld or domain.co.uk style
			result.CompanyDomain = ExtractDomain(result.Hostname)
		}
	}

	return result
}

func ExtractDomain(hostname string) string {
	parts := strings.Split(hostname, ".")
	if len(parts) < 2 {
		return ""
	}
	// Very naive extraction, usually good enough for corporate rDNS
	// e.g. gw.tesla.com -> tesla.com
	// e.g. vpn.us.coca-cola.com -> coca-cola.com
	return strings.Join(parts[len(parts)-2:], ".")
}
