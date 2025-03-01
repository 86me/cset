﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace CSETWebCore.DataLayer.Model
{
    [Keyless]
    public partial class Answer_Standards_InScope
    {
        [Required]
        [StringLength(1)]
        public string mode { get; set; }
        public int assessment_id { get; set; }
        public int answer_id { get; set; }
        public int is_requirement { get; set; }
        public int question_or_requirement_id { get; set; }
        public bool? mark_for_review { get; set; }
        public string comment { get; set; }
        [StringLength(2048)]
        public string alternate_justification { get; set; }
        public int? question_number { get; set; }
        [Required]
        [StringLength(50)]
        public string answer_text { get; set; }
        public Guid component_guid { get; set; }
        public bool? is_component { get; set; }
        [StringLength(50)]
        public string custom_question_guid { get; set; }
        public bool? is_framework { get; set; }
        public int? old_answer_id { get; set; }
        public bool reviewed { get; set; }
        [StringLength(2048)]
        public string FeedBack { get; set; }
        public string Question_Text { get; set; }
    }
}