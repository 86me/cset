﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CSETWebCore.Model.Demographic
{
    public class ExtendedDemographic
    {
        public int AssessmentId { get; set; }

        public int? SectorId { get; set; }
        public int? SubSectorId { get; set; }

        public string Employees { get; set; }
        public string CustomersSupported { get; set; }

        public string GeographicScope { get; set; }
        public string CioExists { get; set; }
        public string CisoExists { get; set; }
        public string CyberTrainingProgramExists { get; set; }
        public string cyberRiskService { get; set; }
    }


    public class StateRegion
    {
        public string State { get; set; }
        public string RegionCode { get; set; }
        public string RegionName { get; set; }
        public List<County> Counties { get; set; } = new List<County>();
    }


    public class County
    {
        public string FIPS { get; set; }
        public string Name { get; set; }
        public string State { get; set; }
    }


    public class ListItem
    {
        public int Id { get; set; }
        public string Value { get; set; }
    }

    public class GeographicSelections
    {
        public List<GeoRegion> Regions { get; set; } = new List<GeoRegion>();
        public List<string> CountyFips { get; set; } = new List<string>();
        public List<string> MetroFips { get; set; } = new List<string>();
    }

    public class GeoRegion
    {
        public string State { get; set; }
        public string RegionCode { get; set; }
    }
}
