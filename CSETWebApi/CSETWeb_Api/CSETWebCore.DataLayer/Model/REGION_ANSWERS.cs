﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CSETWebCore.DataLayer.Model
{
    public partial class REGION_ANSWERS
    {
        [Key]
        public int Assessment_Id { get; set; }
        [Key]
        [StringLength(50)]
        public string State { get; set; }
        [Key]
        [StringLength(50)]
        public string RegionCode { get; set; }

        [ForeignKey("Assessment_Id")]
        [InverseProperty("REGION_ANSWERS")]
        public virtual ASSESSMENTS Assessment { get; set; }
        [ForeignKey("State,RegionCode")]
        [InverseProperty("REGION_ANSWERS")]
        public virtual STATE_REGION STATE_REGION { get; set; }
    }
}